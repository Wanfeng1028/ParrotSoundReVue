package middleware

import (
	"strings"
	"time"

	"parrot-backend-go/internal/model"
	"parrot-backend-go/pkg/response"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"gorm.io/gorm"
)

// Claims JWT 载荷，与 Node 版 {userId, email} 对齐
type Claims struct {
	UserID uint   `json:"userId"`
	Email  string `json:"email"`
	jwt.RegisteredClaims
}

// CreateToken 生成 JWT，有效期 7 天
func CreateToken(user *model.User, secret string) (string, error) {
	claims := Claims{
		UserID: user.ID,
		Email:  user.Email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

// JWTAuth JWT 认证中间件，验证 Bearer token 并加载用户到 context
func JWTAuth(secret string, db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		token := strings.TrimPrefix(header, "Bearer ")
		if token == "" || token == header {
			response.Fail401(c, "请先登录")
			c.Abort()
			return
		}

		claims := &Claims{}
		parsed, err := jwt.ParseWithClaims(token, claims, func(t *jwt.Token) (interface{}, error) {
			return []byte(secret), nil
		})
		if err != nil || !parsed.Valid {
			response.Fail401(c, "登录状态已过期")
			c.Abort()
			return
		}

		// 查用户，确保用户仍然存在且有效
		var user model.User
		if err := db.First(&user, claims.UserID).Error; err != nil {
			response.Fail401(c, "登录状态无效")
			c.Abort()
			return
		}
		if user.Status == "disabled" {
			response.Fail401(c, "账户已停用")
			c.Abort()
			return
		}

		c.Set("userID", user.ID)
		c.Set("email", user.Email)
		c.Set("role", user.Role)
		c.Set("user", &user)
		c.Next()
	}
}
