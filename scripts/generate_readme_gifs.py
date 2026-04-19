import asyncio
import base64
import contextlib
import json
import os
import shutil
import subprocess
import tempfile
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import requests
from PIL import Image
import websockets


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "docs" / "demo"
SCREEN_DIR = OUTPUT_DIR / "_frames"
BASE_URL = os.environ.get("PARROT_CAPTURE_BASE_URL", "http://127.0.0.1:5173")
VIEWPORT_WIDTH = 1440
VIEWPORT_HEIGHT = 900
GIF_WIDTH = 1120
GIF_HEIGHT = 700
DEBUG_PORT = 9223
CHROME_CANDIDATES = [
    Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe"),
    Path(r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"),
]


@dataclass
class CaptureStep:
    route: str
    name: str
    auth: str = "none"
    script: str | None = None
    wait_ms: int = 1400


@dataclass
class GifSpec:
    filename: str
    label: str
    steps: list[CaptureStep] = field(default_factory=list)


class CDPSession:
    def __init__(self, websocket_url: str):
        self.websocket_url = websocket_url
        self.message_id = 0
        self.pending: dict[int, asyncio.Future[Any]] = {}
        self.events: dict[str, list[asyncio.Future[Any]]] = {}
        self.ws: websockets.WebSocketClientProtocol | None = None
        self.receiver_task: asyncio.Task[None] | None = None

    async def __aenter__(self):
        self.ws = await websockets.connect(self.websocket_url, max_size=None)
        self.receiver_task = asyncio.create_task(self._receiver())
        return self

    async def __aexit__(self, exc_type, exc, tb):
        if self.receiver_task:
            self.receiver_task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await self.receiver_task
        if self.ws:
            await self.ws.close()

    async def _receiver(self):
        assert self.ws is not None
        async for raw_message in self.ws:
            message = json.loads(raw_message)
            if "id" in message:
                future = self.pending.pop(message["id"], None)
                if future and not future.done():
                    if "error" in message:
                        future.set_exception(RuntimeError(message["error"]))
                    else:
                        future.set_result(message.get("result", {}))
                continue

            method = message.get("method")
            if not method:
                continue
            waiters = self.events.get(method, [])
            for waiter in waiters[:]:
                if not waiter.done():
                    waiter.set_result(message.get("params", {}))
                waiters.remove(waiter)

    async def send(self, method: str, params: dict[str, Any] | None = None):
        assert self.ws is not None
        self.message_id += 1
        future: asyncio.Future[Any] = asyncio.get_running_loop().create_future()
        self.pending[self.message_id] = future
        await self.ws.send(json.dumps({"id": self.message_id, "method": method, "params": params or {}}))
        return await future

    async def wait_event(self, method: str, timeout: float = 10):
        future: asyncio.Future[Any] = asyncio.get_running_loop().create_future()
        self.events.setdefault(method, []).append(future)
        return await asyncio.wait_for(future, timeout=timeout)


def find_chrome() -> Path:
    for candidate in CHROME_CANDIDATES:
        if candidate.exists():
            return candidate
    raise FileNotFoundError("Chrome or Edge was not found in standard install locations.")


def launch_browser():
    chrome_path = find_chrome()
    user_data_dir = Path(tempfile.mkdtemp(prefix="parrotsound-capture-"))
    process = subprocess.Popen(
        [
            str(chrome_path),
            f"--remote-debugging-port={DEBUG_PORT}",
            "--headless=new",
            "--disable-gpu",
            "--hide-scrollbars",
            "--mute-audio",
            "--no-first-run",
            "--no-default-browser-check",
            f"--user-data-dir={user_data_dir}",
            "about:blank",
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    for _ in range(40):
        try:
            response = requests.get(f"http://127.0.0.1:{DEBUG_PORT}/json/version", timeout=0.5)
            if response.ok:
                return process, user_data_dir
        except requests.RequestException:
            time.sleep(0.25)

    process.terminate()
    raise RuntimeError("Failed to start headless Chrome.")


def create_target():
    response = requests.put(f"http://127.0.0.1:{DEBUG_PORT}/json/new?about:blank", timeout=5)
    response.raise_for_status()
    payload = response.json()
    return payload["id"], payload["webSocketDebuggerUrl"]


def close_target(target_id: str):
    requests.get(f"http://127.0.0.1:{DEBUG_PORT}/json/close/{target_id}", timeout=5)


async def prepare_page(session: CDPSession):
    await session.send("Page.enable")
    await session.send("Runtime.enable")
    await session.send(
        "Emulation.setDeviceMetricsOverride",
        {
            "width": VIEWPORT_WIDTH,
            "height": VIEWPORT_HEIGHT,
            "deviceScaleFactor": 1,
            "mobile": False,
        },
    )
    await session.send("Emulation.setDefaultBackgroundColorOverride", {"color": {"r": 255, "g": 255, "b": 255, "a": 1}})


async def navigate(session: CDPSession, url: str, wait_ms: int = 1200):
    load_waiter = asyncio.create_task(session.wait_event("Page.loadEventFired", timeout=15))
    await session.send("Page.navigate", {"url": url})
    await load_waiter
    await asyncio.sleep(wait_ms / 1000)


async def evaluate(session: CDPSession, expression: str):
    return await session.send(
        "Runtime.evaluate",
        {
            "expression": expression,
            "awaitPromise": True,
            "returnByValue": True,
        },
    )


async def set_user_auth(session: CDPSession, enabled: bool):
    await navigate(session, f"{BASE_URL}/home", 1000)
    if enabled:
        await evaluate(
            session,
            """
            (() => {
              localStorage.setItem('frontendDemoMode', '1');
              localStorage.setItem('token', 'frontend-demo-token');
              return 'user-auth-on';
            })()
            """,
        )
    else:
        await evaluate(
            session,
            """
            (() => {
              localStorage.removeItem('frontendDemoMode');
              localStorage.removeItem('token');
              sessionStorage.clear();
              return 'user-auth-off';
            })()
            """,
        )


async def set_admin_auth(session: CDPSession, enabled: bool):
    await navigate(session, f"{BASE_URL}/home", 1000)
    if enabled:
        await evaluate(
            session,
            """
            (() => {
              localStorage.setItem('parrot-admin-session', '1');
              if (!localStorage.getItem('parrot-admin-state')) {
                localStorage.setItem(
                  'parrot-admin-state',
                  JSON.stringify({
                    account: 'admin',
                    password: 'Parrot123',
                    profile: {
                      username: 'Parrot 管理员',
                      phone: '18800001111',
                      age: '32',
                      gender: '男',
                      avatarUrl: '',
                      securityAnswers: {
                        q1: '1994-01-01',
                        q2: '王芳',
                        q3: '实验小学',
                      },
                    },
                  }),
                );
              }
              return 'admin-auth-on';
            })()
            """,
        )
    else:
        await evaluate(
            session,
            """
            (() => {
              localStorage.removeItem('parrot-admin-session');
              return 'admin-auth-off';
            })()
            """,
        )


async def capture_png(session: CDPSession, output_path: Path):
    shot = await session.send("Page.captureScreenshot", {"format": "png"})
    output_path.write_bytes(base64.b64decode(shot["data"]))


def to_script(raw: str) -> str:
    return " ".join(line.strip() for line in raw.strip().splitlines())


AUTH_LOGIN_SCRIPT = to_script(
    """
    (() => {
      const inputs = Array.from(document.querySelectorAll('input'));
      const values = ['demo@frontend.local', 'Demo123456'];
      inputs.slice(0, 2).forEach((input, index) => {
        input.focus();
        input.value = values[index];
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
      return 'login-filled';
    })()
    """
)

AUTH_SOCIAL_MODAL_SCRIPT = to_script(
    """
    (() => {
      const button = document.querySelector('.social-button');
      button?.click();
      return 'social-modal-opened';
    })()
    """
)

REGISTER_SCRIPT = to_script(
    """
    (() => {
      const inputs = Array.from(document.querySelectorAll('input'));
      const values = ['demo.capture@parrotsound.local', 'Parrot Capture', 'Demo123456', 'Demo123456', '602341'];
      inputs.slice(0, 5).forEach((input, index) => {
        input.focus();
        input.value = values[index];
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
      return 'register-filled';
    })()
    """
)

RESET_SCRIPT = to_script(
    """
    (() => {
      const inputs = Array.from(document.querySelectorAll('input'));
      const values = ['demo@frontend.local', 'NewDemo123456', '847291'];
      inputs.slice(0, 3).forEach((input, index) => {
        input.focus();
        input.value = values[index];
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
      return 'reset-filled';
    })()
    """
)


GIF_SPECS = [
    GifSpec(
        filename="all-pages.gif",
        label="全页面演示 / Full walkthrough",
        steps=[
            CaptureStep("/login", "login", auth="none", script=AUTH_LOGIN_SCRIPT, wait_ms=1600),
            CaptureStep("/login", "login-social", auth="none", script=f"{AUTH_LOGIN_SCRIPT}; {AUTH_SOCIAL_MODAL_SCRIPT}", wait_ms=1800),
            CaptureStep("/register", "register", auth="none", script=REGISTER_SCRIPT, wait_ms=1600),
            CaptureStep("/re-password", "reset-password", auth="none", script=RESET_SCRIPT, wait_ms=1600),
            CaptureStep("/home", "home", auth="user"),
            CaptureStep("/dubbing", "dubbing", auth="user", wait_ms=1700),
            CaptureStep("/clone", "clone", auth="user"),
            CaptureStep("/teaching", "teaching", auth="user", wait_ms=1700),
            CaptureStep("/community", "community", auth="user", wait_ms=1700),
            CaptureStep("/audio-record", "audio-record", auth="user", wait_ms=1700),
            CaptureStep("/help", "help", auth="user"),
            CaptureStep("/user/profile", "user-profile", auth="user", wait_ms=1700),
            CaptureStep("/user/history", "user-history", auth="user", wait_ms=1700),
            CaptureStep("/user/interaction", "user-interaction", auth="user", wait_ms=1700),
            CaptureStep("/user/notification", "user-notification", auth="user", wait_ms=1700),
            CaptureStep("/admin/login", "admin-login", auth="none", wait_ms=1500),
            CaptureStep("/admin/dashboard", "admin-dashboard", auth="admin", wait_ms=1700),
            CaptureStep("/admin/profile", "admin-profile", auth="admin", wait_ms=1700),
        ],
    ),
]


def ensure_server():
    response = requests.get(f"{BASE_URL}/home", timeout=5)
    response.raise_for_status()


async def run_capture(session: CDPSession, step: CaptureStep, output_path: Path):
    if step.auth == "user":
        await set_admin_auth(session, False)
        await set_user_auth(session, True)
    elif step.auth == "admin":
        await set_user_auth(session, False)
        await set_admin_auth(session, True)
    else:
        await set_admin_auth(session, False)
        await set_user_auth(session, False)

    await navigate(session, f"{BASE_URL}{step.route}", step.wait_ms)
    if step.script:
        await evaluate(session, step.script)
        await asyncio.sleep(step.wait_ms / 1000)
    await capture_png(session, output_path)


def compose_gif(input_files: list[Path], output_path: Path):
    frames = []
    for file in input_files:
        image = Image.open(file).convert("P", palette=Image.Palette.ADAPTIVE, colors=128)
        image = image.resize((GIF_WIDTH, GIF_HEIGHT))
        frames.append(image)

    frames[0].save(
        output_path,
        save_all=True,
        append_images=frames[1:],
        duration=[1400] * len(frames),
        loop=0,
        optimize=True,
        disposal=2,
    )


async def generate_gifs():
    ensure_server()
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    if SCREEN_DIR.exists():
        shutil.rmtree(SCREEN_DIR)
    SCREEN_DIR.mkdir(parents=True, exist_ok=True)

    browser_process, user_data_dir = launch_browser()
    try:
        for spec in GIF_SPECS:
            frame_paths: list[Path] = []
            for index, step in enumerate(spec.steps, start=1):
                target_id, websocket_url = create_target()
                png_path = SCREEN_DIR / f"{spec.filename}-{index:02d}-{step.name}.png"
                try:
                    async with CDPSession(websocket_url) as session:
                        await prepare_page(session)
                        await run_capture(session, step, png_path)
                        frame_paths.append(png_path)
                finally:
                    close_target(target_id)
            compose_gif(frame_paths, OUTPUT_DIR / spec.filename)
            print(f"generated {spec.filename}")
    finally:
        browser_process.terminate()
        with contextlib.suppress(Exception):
            browser_process.wait(timeout=5)
        shutil.rmtree(user_data_dir, ignore_errors=True)
        shutil.rmtree(SCREEN_DIR, ignore_errors=True)


def main():
    asyncio.run(generate_gifs())


if __name__ == "__main__":
    main()
