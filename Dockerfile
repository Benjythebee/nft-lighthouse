FROM oven/bun 

# Copy the lock and package file
COPY . . 

# Install dependencies
RUN bun install

RUN bunx prisma db pull --schema=./src/libs/prisma/schema.prisma
RUN bun add prisma && bun install && cd node_modules && ls && ls .prisma && bun run build

EXPOSE 8080
CMD ["bun", "server"]