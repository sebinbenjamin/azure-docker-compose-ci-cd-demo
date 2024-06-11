# A multistage build, with the first stage named AS build
# https://docs.docker.com/build/building/multi-stage/
FROM node:alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Second FROM instruction starts a new build stage 
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80