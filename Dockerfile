FROM oven/bun 

# Copy the lock and package file
COPY . . 

# Install dependencies
# https://github.com/oven-sh/bun/issues/4959
RUN rm -rf bun.lockb && bun install

RUN node node_modules/@cyberbrokers/eth-utils/bin/postinstall.js

RUN bun run build


EXPOSE 8080
CMD ["bun", "server"]