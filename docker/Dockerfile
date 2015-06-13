FROM ants/nodejs:v1
MAINTAINER Romain Crestey <romain.crestey@ants.builders>

ADD .tmp/ /city-core/

RUN cd city-core && npm install
EXPOSE 9000
CMD cd city-core && forever server/index.js prod /data/city-core