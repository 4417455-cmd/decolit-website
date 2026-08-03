# Статика Деколит: Caddy раздаёт ТОЛЬКО папку site/.
# Внутренние материалы (analysis/, CLAUDE.md, plans/) в образ не попадают.
FROM caddy:2-alpine

# Стандартный веб-корень образа Caddy.
COPY site/ /usr/share/caddy/

EXPOSE 80
