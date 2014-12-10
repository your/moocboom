# MOOCBOOM #

A *"at one glance"* deadlines-visualization solution for those determined in succeding with MOOCs.

More info here: [http://res.sharped.net/](http://res.sharped.net/)

## TODO:
* Design a database to allow people to have a personal account with settings [missing settings part] 50%
* Add support for deadlines from other MOOC providers, such as edX [not started yet] 0%
* Add timed email alerts [missing mostly the server-side part] 50%
* Add a script to handle cron jobs for emails and deadlines updates [not started yet] 0%
* Add OAuth2 support - direct linking with Coursera https://tech.coursera.org/app-platform/oauth2/ [not started yet] 0%

## What has been used
* Node.js
* AngularJS
* AngularStrap
* Font Awesome
* MongoDB
* Ruby

## Installing on Deploy server (Debian 6.0) [incomplete]

### Installing Node.js and NPM (root):

    apt-get install nodejs
    apt-get install npm

### Installing NPMs:

    npm install --save mongoose bcryptjs async request xml2js lodash express-session passport passport-local
    npm install --save agenda sugar nodemailer

### Installing Ruby:

    apt-get install ruby
   
### Installing icalendar (https://github.com/icalendar/icalendar) ruby gem (patched)(*):

    gem uninstall icalendar
    cd icalendar_PATCHED
    gem build icalendar.gemspec 
    gem install icalendar-2.2.0.gem 

(\*) N.B. : **this will require the original version to be removed if present**

### Installing MongoDB

http://docs.mongodb.org/manual/tutorial/install-mongodb-on-debian/ (http://docs.mongodb.org/manual/tutorial/install-mongodb-on-debian/)