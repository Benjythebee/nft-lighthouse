FROM oven/bun 

# Copy the lock and package file
COPY . . 

# Install dependencies
# https://github.com/oven-sh/bun/issues/4959
RUN rm -rf bun.lockb && bun install

# https://www.prisma.io/docs/concepts/components/prisma-client#2-installation
RUN bun add --dev prisma && bun x prisma db pull
RUN bun x prisma generate; exit 0
RUN bun run build

EXPOSE 8080
CMD ["bun", "server"]