FROM oven/bun 

# Copy the lock and package file
COPY . . 

# Install dependencies
RUN bun install

RUN bun install prisma && npm install @prisma/client && bunx prisma db pull --schema=./src/libs/prisma/schema.prisma
RUN bun install && cd node_modules && ls -a && ls .prisma -a && bun run build

EXPOSE 8080
CMD ["bun", "server"]