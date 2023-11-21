FROM oven/bun 

# Copy the lock and package file
COPY bun.lockb . 
COPY package.json . 
COPY . . 

# Install dependencies
RUN bun install

RUN bunx prisma db pull --schema=./src/libs/prisma/schema.prisma
RUN bun install
# RUN bunx prisma generate --schema=./src/libs/prisma/schema.prisma
RUN bun run build

EXPOSE 8080
CMD ["bun", "server"]