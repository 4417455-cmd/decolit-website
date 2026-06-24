# Статика Деколит: nginx раздаёт ТОЛЬКО папку site/.
# Внутренние материалы (analysis/, CLAUDE.md, plans/) в образ не попадают.
FROM nginx:1.27-alpine

# Веб-корень — содержимое site/
COPY site/ /usr/share/nginx/html/

EXPOSE 80

# Явный запуск nginx на переднем плане — контейнер не завершается сразу
CMD ["nginx", "-g", "daemon off;"]
