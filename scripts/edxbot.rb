require 'rest_client'

## edX Bot

# TODO: implement this api in add.js https://www.edx.org/search/api/all
# Then, find MOOC code (shortName), such as 
#
#{  
#      "guid":2126,
#      "l":"Introduction to Functional Programming",
#      "schools":[  
#         "DelftX"
#      ],
#      "code":"FP101x",
#      "image":{  
#         "src":"\/sites\/default\/files\/course\/image\/promoted\/haskell_home_378x225.jpg",
#         "alt":"Functional Programming"
#      },
#      "pace":false,
#      "start":"October 15, 2014",
#      "availability":"Archived",
#      "subjects":[  
#         "",
#         "Computer Science",
#         "Engineering"
#      ],
#      "url":"https:\/\/www.edx.org\/course\/introduction-functional-programming-delftx-fp101x",
#      "types":[  
#         "verified"
#      ]
#   }
#
# ... we have a lot of things to do.. related to this script, it should be invoked with something like
#
# ruby EdXBot code guid (or it could be a daemon always on, always logged in)
# .. and it should login if needed, join the course (look for session number [course_run] somewhere!) and fetch deadlines
# .. then store those to mongo.

class EdXBot

	def initialize(
		relic_id = 'XA4GVl5ACwAEV1JQAA==', # this should be fixed on edX servers
		base_url = 'https://courses.edx.org/')

		# Credentials: later these will be choosen from smth like a pool
		@user = 'myname@is.you'
		@pass =  '1234god'
		##

		@base_url = base_url
		@last_response = nil
	
		@session_cookies = nil

		@logged_in = false
	
		@relic_id = relic_id
		@csrftoken = nil
		@session_id = nil

	end

	def get_credentials_payload()
		return { 'email' => @user, 'password' => @pass }
	end


	def http_response(method, url, headers, payload)

		## Using RestClient::Request.execute() for low-level api control 
		response = payload == nil ?
		RestClient::Request.execute(:method => method, :url => url, :headers => headers) :
		RestClient::Request.execute(:method => method, :url => url, :headers => headers, :payload => payload)

		case response.code
		when 200
			p "It worked !"
			response
			return response
		else
			#raise SomeCustomExceptionIfYouWant
			p "ERROR !"
			return nil
		end

	end

	#headers_get = {
	#	:connection => 'keep-alive',
	#	:accept => 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
	#	:user_agent => 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95',
	#	:accept_encoding => 'gzip, deflate, sdch',
	#	:accept_language => 'it-IT,it;q=0.8,en-US;q=0.6,en;q=0.4'
	#}

	def build_headers(method, no_auth, referer)

		# following defaults
		connection = 'keep-alive'
		accept_get = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
		accept_post = 'text/plain, */*; q=0.01'
		user_agent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95'
		content_type_post = 'application/x-www-form-urlencoded; charset=UTF-8'
		accept_lang = 'it-IT,it;q=0.8,en-US;q=0.6,en;q=0.4'
		accept_enc_get = 'gzip, deflate, sdch'
		accept_enc_post = 'gzip, deflate'
		origin = 'https://courses.edx.org'
		requested_with = 'XMLHttpRequest'

		# building referer from @base_url
		referer = referer != nil ? @base_url << referer : nil

		# building headers
		case method
		when 'get'
			my_headers = {
				'Connection' => connection,
				'User-Agent' => user_agent,
				'Accept' => accept_get,
				'Accept-Encoding' => accept_enc_get,
				'Accept-Language' => accept_lang,
			}
		# ! POST presumes you have @session_cookies set ! #
		# (use it good.)
		when 'post' 
			my_headers = {
				'Connection' => connection,
				'User-Agent' => user_agent,
				'Origin' => origin,
				'Referer' => referer,
				## X-Headers
				'X-CSRFToken' => @csrftoken, # presumes you have @session_cookies set
				'X-NewRelic-ID' => @relic_id, # def
				'X-Requested-With' => requested_with,
				##################################### 
				'Content-Type' => content_type_post,
				'Accept' => accept_post,
				'Accept-Encoding' => accept_enc_post,
				'Accept-Language' => accept_lang,
				'Cookie' => @session_cookies,
			}
		end

		p my_headers
		return my_headers

	end


	# get value from dict
	def extract_value(key, from, is_json)

		from = is_json ? from : from.to_json
		given_hash = JSON.parse(from)
		value = given_hash[key]

		return value

	end


	# ! always be sure to call this before a POST etc
	def build_session_cookie(raw_cookies)

		@csrftoken = extract_value('csrftoken', raw_cookies, false)
		@session_id = extract_value('prod-edx-sessionid', raw_cookies, false)
		awselb = extract_value('AWSELB', raw_cookies, false) # doesnt need to be globally available

		@session_cookies = ''

		@session_cookies << 'csrftoken=' << @csrftoken << '; '
		@session_cookies << 'prod-edx-sessionid=' << @session_id << '; '
		@session_cookies << 'AWSELB=' << awselb

	end

	def login()

		# GET /login HTTP/1.1
		# ...
		p "-----> GET /login HTTP/1.1 ..."
		@last_response = http_response(:get, @base_url + 'login', build_headers('get', true, ''), nil)
		# ...
		# Set-Cookie: csrftoken=dt7xSzHjT1UKLGoq2iVUvKeucyTswQYD; expires=Wed, 16-Dec-2015 14:22:44 GMT; Max-Age=31449600; Path=/
		# Set-Cookie: prod-edx-sessionid=1c2052cdf0206d99acdf550f8921ebd9; Domain=.edx.org; expires=Wed, 31-Dec-2014 14:22:44 GMT; httponly; Max-Age=1209600; Path=/
		# Set-Cookie: AWSELB=D1EF6B6510E347E5B895826CD53CF4FD55E0CFA9A90749CECFD3E3A420861CE2F36D6BE86B82FAD9CD396BAF3EC8D9E08447C8402E02BCE674AE7DF73E7E4C76A518F31589;PATH=/	
		# ...
		if @last_response != nil

			raw_cookies = @last_response.cookies # TODO: save them in memory (program-wide)

			build_session_cookie(raw_cookies) # build session cookie to send each time

			payload = get_credentials_payload()

			p @last_response

			p payload

			# now POST to auth..
			p "-----> POST /login_ajax HTTP/1.1 ..."
			@last_response = http_response(:post, @base_url + 'login_ajax', build_headers('post', true, 'login'), payload)

			if @last_response != nil

				p @last_response

				@logged_in = true if login_success(@last_response)

				if @logged_in == false
					p "Error with credentials"
					return false
				end

			else
				p "Error @ /login_ajax"
				return false
			end

		else
			p "Error @ /login"
			return false
		end

		return true

	end

	def login_success(last_response)
		#"{\n  \"redirect_url\": null,\n  \"success\": true\n}"
		return extract_value('success', last_response, true)
	end

	def dashboard()
	end

	def do_the_job()
		if login()
			p "All ok."
			dashboard()
		else
			p "ERRORS!!!"
		end
	end
end

boss = EdXBot.new
boss.do_the_job()

