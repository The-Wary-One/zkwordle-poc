FROM node:16-alpine as base
RUN apk add --no-cache \
        ca-certificates \
        gcc \
        git \
        curl \
        musl-dev \
        bash

# install Rust. https://github.com/rust-lang/docker-rust/blob/76c10aa123b24a4554b6af247d12f17f4b1a4edc/1.58.1/alpine3.15/Dockerfile
ENV RUSTUP_HOME=/usr/local/rustup \
    CARGO_HOME=/usr/local/cargo \
    PATH=/usr/local/cargo/bin:$PATH \
    RUST_VERSION=1.58.1

RUN set -eux; \
    apkArch="$(apk --print-arch)"; \
    case "$apkArch" in \
        x86_64) rustArch='x86_64-unknown-linux-musl'; rustupSha256='bdf022eb7cba403d0285bb62cbc47211f610caec24589a72af70e1e900663be9' ;; \
        aarch64) rustArch='aarch64-unknown-linux-musl'; rustupSha256='89ce657fe41e83186f5a6cdca4e0fd40edab4fd41b0f9161ac6241d49fbdbbbe' ;; \
        *) echo >&2 "unsupported architecture: $apkArch"; exit 1 ;; \
    esac; \
    url="https://static.rust-lang.org/rustup/archive/1.24.3/${rustArch}/rustup-init"; \
    wget "$url"; \
    echo "${rustupSha256} *rustup-init" | sha256sum -c -; \
    chmod +x rustup-init; \
    ./rustup-init -y --no-modify-path --profile minimal --default-toolchain $RUST_VERSION --default-host ${rustArch}; \
    rm rustup-init; \
    chmod -R a+w $RUSTUP_HOME $CARGO_HOME; \
    rustup --version; \
    cargo --version; \
    rustc --version;

# install circom
WORKDIR /usr/local/lib
RUN git clone https://github.com/iden3/circom.git && \
    cd circom && \
    cargo build --release && \
    cargo install --path circom
# install node dependencies
WORKDIR /app
COPY . .
RUN yarn install --non-interactive

# build the zk circuit
WORKDIR /app/packages/circuits
RUN yarn run compile && \
    yarn run info && \
    yarn run setup && \
    yarn run verificationKey

# build the server app
WORKDIR /app/packages/server
RUN yarn run copy:zk && \
    yarn run codegen && \
    yarn run compile && \
    yarn run copy:wasm:build

# build the client app
WORKDIR /app/packages/client
RUN yarn run codegen && \
    yarn run copy:key && \
    yarn run build


FROM node:16-alpine as server
WORKDIR /app
COPY --from=base /app/packages/server/package*.json ./
RUN yarn install --non-interactive --prod
COPY --from=base /app/packages/server/build ./
CMD node main.js

FROM base AS client-dev
WORKDIR /app/packages/client
CMD npm run start