sudo node /bakerx/fuzzer/fuzzer.js /home/vagrant/iTrust2-v8/iTrust2/src/main/java
cd /home/vagrant/iTrust2-v8/iTrust2/
sudo mvn clean test
sudo node /bakerx/fuzzer/count.js /home/vagrant/iTrust2-v8/iTrust2/target/surefire-reports
cd /home/vagrant/iTrust2-v8
sudo git reset --hard HEAD