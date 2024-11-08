echo "Start initialization..."
echo "Install Node.js libraries..."
cd api-and-cli-client
pwd
npm install

cd ../react-app
pwd
npm install
cd ..

echo "Setting default root user password..."
cd api-and-cli-client/src/server
mkdir -p data/sensitive/
cd data/sensitive/
echo "@#4!A^@*VA9" > db.password

echo "Initialization finished"