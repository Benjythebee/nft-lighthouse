FROM oven/bun 

# Copy the lock and package file
COPY . . 

# Install dependencies
# https://github.com/oven-sh/bun/issues/4959
RUN rm -rf bun.lockb && bun install

# https://www.prisma.io/docs/concepts/components/prisma-client#2-installation
RUN bun install @prisma/client && bunx prisma db pull --schema=./src/libs/prisma/schema.prisma
RUN bun install && cd node_modules && ls -a && ls .prisma -a && cd.. && bun run build

EXPOSE 8080
CMD ["bun", "server"]