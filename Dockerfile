FROM alpine:3.12.0

#### <general-tools>
RUN echo "Installing general tools" \
&& apk --no-cache add \
  build-base \
  bash \
  git \
  curl \
  wget \
  openjdk8-jre \
  ca-certificates

#### https://github.com/Docker-Hub-frolvlad/docker-alpine-python3/blob/master/Dockerfile
ENV PYTHONUNBUFFERED=1

RUN echo "**** install Python ****" && \
  apk add --no-cache python3 && \
  if [ ! -e /usr/bin/python ]; then ln -sf python3 /usr/bin/python ; fi && \
  \
  echo "**** install pip ****" && \
  python3 -m ensurepip && \
  rm -r /usr/lib/python*/ensurepip && \
  pip3 install --no-cache --upgrade pip setuptools wheel && \
  if [ ! -e /usr/bin/pip ]; then ln -s pip3 /usr/bin/pip ; fi

ENV GLIBC_VERSION 2.28-r0

# Glibc compatibility
RUN wget -q -O /etc/apk/keys/sgerrand.rsa.pub https://alpine-pkgs.sgerrand.com/sgerrand.rsa.pub \
&&  wget "https://github.com/sgerrand/alpine-pkg-glibc/releases/download/$GLIBC_VERSION/glibc-$GLIBC_VERSION.apk" \
&&  apk --no-cache add "glibc-$GLIBC_VERSION.apk" \
&&  rm "glibc-$GLIBC_VERSION.apk" \
&&  wget "https://github.com/sgerrand/alpine-pkg-glibc/releases/download/$GLIBC_VERSION/glibc-bin-$GLIBC_VERSION.apk" \
&&  apk --no-cache add "glibc-bin-$GLIBC_VERSION.apk" \
&&  rm "glibc-bin-$GLIBC_VERSION.apk" \
&&  wget "https://github.com/sgerrand/alpine-pkg-glibc/releases/download/$GLIBC_VERSION/glibc-i18n-$GLIBC_VERSION.apk" \
&&  apk --no-cache add "glibc-i18n-$GLIBC_VERSION.apk" \
&&  rm "glibc-i18n-$GLIBC_VERSION.apk"

ENV TIMEZONE America/Los_Angeles

RUN	apk update && \
	apk upgrade && \
	apk add --update tzdata && \
	cp /usr/share/zoneinfo/${TIMEZONE} /etc/localtime && \
	echo "${TIMEZONE}" > /etc/timezone && \
	apk add --update nodejs nodejs-npm && \
	apk del tzdata && \
	mkdir /www && \
	rm -rf /var/cache/apk/*

ARG HOST_USERS_GROUP_ID

# By default, the applications process inside a Docker container runs as a “root” user.
# This can pose a potentially serious security risk when running in production, hence creating a non-root user
# Create docker group with host group id and then add user babylon to it and then change group_id for babylon to jenkins group 'users'.
# RUN addgroup -g ${HOST_USERS_GROUP_ID} 'docker' && \
#	adduser -S babylon -G docker

RUN apk --no-cache add shadow && \
	addgroup docker && \
	adduser -S babylon -G docker && \
    usermod -g ${HOST_USERS_GROUP_ID} babylon

USER babylon