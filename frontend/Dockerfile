########################################
# Stage 1 — build the Vite SPA
########################################
FROM node:20-alpine AS build

WORKDIR /workspace
COPY package.json package-lock.json ./
RUN npm ci

COPY index.html vite.config.js eslint.config.js ./
COPY public ./public
COPY src ./src

ARG VITE_API_URL=http://localhost:8080
ENV VITE_API_URL=$VITE_API_URL
ARG VITE_STRIPE_PUBLIC_KEY=
ENV VITE_STRIPE_PUBLIC_KEY=$VITE_STRIPE_PUBLIC_KEY

RUN npm run build

########################################
# Stage 2 — nginx static server
########################################
FROM nginx:1.27-alpine

COPY --from=build /workspace/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --spider -q http://127.0.0.1/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
