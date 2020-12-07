## Building Whisker Web

```bash
# Clone whisker-main and whisker-web in the same directory

git clone https://github.com/se2p/whisker-main
git clone https://github.com/se2p/whisker-web

# Install dependencies and build both projects
# Use 'npm run build:prod' for production build

cd whisker-main
npm install
npm run build
cd ..

cd whisker-web
npm install
npm run build
cd ..

# Then just open 'whisker-web/dist/index.html' in your browser (e.g. firefox)

firefox whisker-web/dist/index.html
```
