# Статика Деколит: nginx раздаёт ТОЛЬКО папку site/.
# Внутренние материалы (analysis/, CLAUDE.md, plans/) в образ не попадают.
FROM nginx:alpine

# Веб-корень — содержимое site/
COPY site/ /usr/share/nginx/html/

EXPOSE 80
