FROM oven/bun 

# Copy the lock and package file
COPY bun.lockb . 
COPY package.json . 
COPY . . 

# Install dependencies
RUN bun install

RUN bun prisma:setup && bun build

EXPOSE 8080
CMD ["bun", "server"]