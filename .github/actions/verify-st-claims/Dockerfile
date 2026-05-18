FROM node:24-alpine

WORKDIR /app

# Install st-lang and glob
RUN npm install --no-save @stevenvo780/st-lang@^4.14.0 glob@^11.0.0

COPY verify.mjs entrypoint.sh ./
RUN chmod +x entrypoint.sh

ENTRYPOINT ["/app/entrypoint.sh"]
