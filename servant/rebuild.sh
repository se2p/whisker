# rebuilds the whisker main and then then whisker web repository
cd ../whisker-main/ && npm run build && cd ../whisker-web/ && npm run build && cd ./servant
