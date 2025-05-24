clear
clear
echo "Building the project..."
echo "Cleaning up old build files..."
rm -rf node_modules .deno .vite .cache package-lock.json deno.lock
#cd client
#rm -rf node_modules .deno .vite .cache package-lock.json deno.lock
#cd ..
cd server
rm -rf node_modules .deno .vite .cache package-lock.json deno.lock
cd ..
echo "Building the client..."
docker compose down
docker compose up server
