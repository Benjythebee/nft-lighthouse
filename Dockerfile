FROM oven/bun 

# Copy the lock and package file
COPY bun.lockb . 
COPY package.json . 
COPY tsconfig.json . 

# Install dependencies
RUN bun install --frozen-lockfile

# Copy your source code
# If only files in the src folder changed, this is the only step that gets executed!
COPY src ./src 

RUN bun prisma:setup && bun build

EXPOSE 8080
CMD ["bun", "server"]