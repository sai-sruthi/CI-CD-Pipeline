cd /bakerx/fuzzer
sudo npm install --save glob
cd /home/vagrant
sudo rm -rf iTrust2-v8
sudo git clone https://$GH_USER:$GH_PASS@github.ncsu.edu/engr-csc326-staff/iTrust2-v8.git
sudo git checkout main
cd /home/vagrant/iTrust2-v8/iTrust2/src/main/resources
sudo cp application.yml.template application.yml
sudo sed -i "s/password:/password: root/" application.yml
cd /home/vagrant/iTrust2-v8/iTrust2 
sudo mvn -f pom.xml process-test-classes
cd /home/vagrant/iTrust2-v8/iTrust2
sudo mvn clean test checkstyle:checkstyle