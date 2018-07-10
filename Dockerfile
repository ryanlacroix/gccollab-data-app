FROM node:6.14.2-slim
MAINTAINER GCTools

# Update packages
RUN apt update -y
RUN apt upgrade -y

# Install Python & non-pip module dependencies
RUN apt install python3 -y
RUN apt install python3-pip -y
RUN apt install libssl-dev -y
RUN apt install libffi-dev -y

# Run npm install before adding other files in to keep rebuild time short
COPY package.json /tmp/package.json
RUN cd /tmp && npm install
RUN mkdir -p /app && cp -a /tmp/node_modules /app/ 

# Get all Python depencies
RUN pip3 install numpy
RUN pip3 install pandas
RUN pip3 install sqlalchemy
RUN pip3 install --upgrade google-api-python-client
RUN pip3 install --upgrade setuptools
RUN pip3 install cryptography
RUN pip3 install cffi
RUN pip3 install sshtunnel
RUN pip3 install oauth2client
RUN pip3 install pymysql

RUN npm install -g forever

WORKDIR /app
ADD . /app

EXPOSE 3000

# Start the app
cmd ["./start.sh"]
