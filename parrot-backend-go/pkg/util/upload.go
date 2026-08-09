package util

import (
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
)

// SaveUploadedFile 保存 multipart 上传文件到指定路径（Hertz 无内置方法，提供等价实现）
// 与 Gin 的 c.SaveUploadedFile 行为一致
func SaveUploadedFile(fh *multipart.FileHeader, dst string) error {
	src, err := fh.Open()
	if err != nil {
		return err
	}
	defer src.Close()

	if err := os.MkdirAll(filepath.Dir(dst), 0o755); err != nil {
		return err
	}

	out, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer out.Close()

	_, err = io.Copy(out, src)
	return err
}
