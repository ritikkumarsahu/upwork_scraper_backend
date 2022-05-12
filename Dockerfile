FROM ubuntu:bionic

ENV NODEJS_VERSION 16

# 0. Install Git
# RUN apt-get update && apt-get install -y git

# 1. Install Node.js
RUN apt-get update && apt-get install -y curl && \
    curl -sL https://deb.nodesource.com/setup_$NODEJS_VERSION.x | bash - && \
    apt-get install -y nodejs

# 2. Install WebKit dependencies
# RUN apt-get update && apt-get install -y --no-install-recommends \
#     libwoff1 \
#     libopus0 \
#     libwebp6 \
#     libwebpdemux2 \
#     libenchant1c2a \
#     libgudev-1.0-0 \
#     libsecret-1-0 \
#     libhyphen0 \
#     libgdk-pixbuf2.0-0 \
#     libegl1 \
#     libnotify4 \
#     libxslt1.1 \
#     libevent-2.1-6 \
#     libgles2 \
#     libvpx5 \
#     libxcomposite1 \
#     libatk1.0-0 \
#     libatk-bridge2.0-0 \
#     libepoxy0 \
#     libgtk-3-0 \
#     libharfbuzz-icu0

# # 3. Install gstreamer and plugins to support video playback in WebKit.
# RUN apt-get update && apt-get install -y --no-install-recommends \
#     libgstreamer-gl1.0-0 \
#     libgstreamer-plugins-bad1.0-0 \
#     gstreamer1.0-plugins-good \
#     gstreamer1.0-libav

# # 4. Install Chromium dependencies
# RUN apt-get update && apt-get install -y --no-install-recommends \
#     libnss3 \
#     libxss1 \
#     libasound2 \
#     fonts-noto-color-emoji \
#     libxtst6

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgtk-3-0 \                      
    libxcomposite1 \                              
    libxtst6 \                                    
    libatk1.0-0 \                                
    libcairo-gobject2

# 5. Install Firefox dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libdbus-glib-1-2 \
    libxt6

# 6. Install ffmpeg to bring in audio and video codecs necessary for playing videos in Firefox.
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg
# # 7. Install Yarn
# RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - && \
#     echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list && \
#     apt update && \
#     apt install yarn

# # 8. (Optional) Install XVFB if there's a need to run browsers in headful mode
# RUN apt-get update && apt-get install -y --no-install-recommends \
#     xvfb
# Working directory inside app
WORKDIR /backend
#Copy the index.html file /usr/share/nginx/html/
COPY . .
# Install app dependecy 
RUN npm install 
#Expose Port
EXPOSE 3000

CMD ["node","index.js"]