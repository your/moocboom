require 'icalendar' # NB: icalendar gem is modded by me to support X_WR_CALNAME field
require 'open-uri'
require 'date'
require 'json'
require 'mongo'



#### Coursera iCal fetcher + mongodb updater ###########################
##### DON'T USE IF YOU DON'T KNOW WHAT YOU ARE DOING!

# dead class
class Deadline < Struct.new(:_id, :sessionName, :moocId, :summary, :description, :startDate, :endDate, :url, :type, :hard, :subscribers, :alarmOn, :subsOn, :subsDone); end

# json struct
class Struct
  def to_map
    map = Hash.new
    self.members.each { |m| map[m] = self[m] }
    map
  end

  def to_json(*a)
    to_map.to_json(*a)
  end
end

class ICallMe

	# If we don't specify coordinates, we start at 0.
	def initialize(

		head_url = 'https://class.coursera.org/',
		tail_url = '/api/course/calendar',
		full_url = '',
		session_name,
		mooc_id,
		user_id,
		verbose_mode)

		@head_url = head_url
		@tail_url = tail_url
		@session_name = session_name
		@mooc_id = mooc_id
		@user_id = user_id
		@full_url = generate_url()
		@verbose_mode = verbose_mode
		@status = false


	end

	def generate_url()
		# putting URL togheter (i.e. https://class.coursera.org/audio-001/api/course/calendar)
		return @head_url.to_s + @session_name.to_s + @tail_url.to_s
	end

	def do_the_job()

		cal = fetch_ical(@session_name)
		json = get_deadlines_from_ical(cal)

		puts '-- /beg {Deadlines partial generated JSON} -----------------------------------------' if @verbose_mode
		puts JSON.pretty_generate(json) if @verbose_mode
		puts '-- /end {Deadlines partial generated JSON} -----------------------------------------' if @verbose_mode

		add_deadlines(json)

		print @status # returning to caller true or false

	end

	def add_deadlines(json)

		puts "## Connecting to mongodb.." if @verbose_mode
		db   = Mongo::Connection.new.db('test')
		coll = db.collection('deadlines')

		hashes = JSON.parse(json)

		# db.moocs.update({ $and: [{ _id: 1432 }, { rating: 0 }] }, { $set: { sessions : { active : 0 } } })
		# db.moocs.update({ $and: [{ _id: 1432 }, { rating: 0 }] }, { $addToSet: { tags : {active : 0, lol: 1}} })
		# db.moocs.update({ $and: [{ _id: 1432 }, { rating: 0 }] }, { $addToSet: {tags: {active : [{active:1}]}} })

		# db.moocs.update({'sessions.active': 0}, {$set: {'sessions.active': 1}})

		puts "## Adding deadlines to existent session... " if @verbose_mode

####### TODO: fix this http://stackoverflow.com/questions/21011773/addtoset-works-like-push
####### (duplicates from ruby script)
		## NB: updating data by session name (should be unique)
		hashes.each_with_index { |deadline, index| # TODO: error handling
			coll.save(deadline)
			# coll.update({ "sessions.sessionName" => @session_name }, { "$addToSet" => { "deadlines" => deadline }})
			# coll.update({ "sessions.sessionName" => @session_name }, { "$addToSet" => { "deadlines" => deadline }})

		}

		@status = true # TODO: error handling (start from here)

		puts "## Shold be done, joe!" if @verbose_mode

	end

	def fetch_ical(session_name)

		puts "## Fetching #{@full_url} ..." if @verbose_mode

		# getting calendar from URL
		temporary_now = Time.now.to_i + Random.rand(0...1000000000)

		cal_out = 'temp_' + temporary_now.to_s + '.cal'

    	begin
			File.open(cal_out, "wb") do |saved_file| # TODO: error handling
 				open(@full_url, "rb") do |read_file|
   			 		saved_file.write(read_file.read) # getting things
  				end
			end
		rescue OpenURI::HTTPError => ex
     		puts "[!!!!] ERROR [!!!!]" if @verbose_mode
    	end 

		puts "## Done!" if @verbose_mode

		return cal_out
	end

	##
	## BUG FIX: need to sanitize X-WR-CALNAME field:
	## if it contains a non-escaped ',' it will give troubles
	## (can't understand why I found this field with ',' unescaped,
	## other fields have all ',' escaped - Coursera, their bad? ;p)
	##
	def check_ical(cal_file)

		bug_line = 0
		cal_name = nil
		fix_me = false

		cal_array = []

		cal = File.open(cal_file, 'r') do |f|
			f.each_line.with_index do |line, i|
				cal_array << line
				if (line.index('X-WR-CALNAME') != nil)
					bug_line = i
					found_comma = line.index(',')
					escaped_yet = line.index('\,')
					found_comma != nil ? (escaped_yet != nil ? (break) : (fix_me = true)) : nil
				end
			end
		end

		if fix_me
			puts "!!!!! FOUND COMMA BUG !!!!!"  if @verbose_mode
			fix_ical(bug_line, cal_file, cal_array)
		end

	end

	## TODO: FIX LATER TO FIX MORE THAN ONE UNESCAPED COMMA!! ##
	def fix_ical(bug_line, cal_file, cal_array)

		puts '## Fixing ical...' if @verbose_mode

		cal_name = cal_array[bug_line].split(',')
		new_name = cal_name[0] + '\,' + cal_name [1] # adding escape \

		cal_array[bug_line] = new_name

		File.open(cal_file, 'w') do |f|
  			f.puts(cal_array)
		end

		puts '## Should be fixed now.' if @verbose_mode

	end

	def parse_ical(cal_file)

		# Open a file or pass a string to the parser
		cal_file = File.open(cal_file)

		# Parser returns an array of calendars because a single file
		# can have multiple calendars.
		cals = Icalendar.parse(cal_file)

		deadpool = Array.new

			cals.each { |cal|
	
			events = cal.events # 1 event = 1 deadline
	
			events.each { |event|
	
				puts '## Adding new deadline...' if @verbose_mode

				dead_summary = event.summary
				dead_description = event.description
				dead_time_beg = event.dtstart
				dead_time_end = event.dtend
				dead_url = event.location
				dead_type = event.uid.split('|')[1]
				dead_id = event.uid.split('|')[2].to_i
				dead_hard = event.uid.split('|')[3] == 'hard'? 1 : 0 # 1 = hard, 0 = soft

				sub = Array.new
				sid = @user_id
				sub << sid

				# create object
				deadline = Deadline.new(
					dead_id,
					@session_name,
					@mooc_id.to_i,	
					dead_summary,
					dead_description,
					dead_time_beg.strftime('%s'), # .to_i not working on newer version of ruby (?)
					dead_time_end.strftime('%s'),
					dead_url,
					dead_type,
					dead_hard,
					sub, Array.new, Array.new, Array.new)

				# add to deadpool
				deadpool.push(deadline)

				puts "> dead_id: #{dead_id}" if @verbose_mode
				puts "> dead_summary: #{dead_summary}" if @verbose_mode
				puts "> dead_description: #{dead_description}" if @verbose_mode
				puts "> dead_time_beg.to_i: #{dead_time_beg.to_i}" if @verbose_mode
				puts "> dead_time_end.to_i: #{dead_time_end.to_i}" if @verbose_mode
				puts "> dead_url: #{dead_url}" if @verbose_mode
				puts "> dead_type: #{dead_type}" if @verbose_mode
				puts "> dead_hard: #{dead_hard}" if @verbose_mode

				puts '## Added!' if @verbose_mode
		
			}
		}

		return deadpool

	end

	def generate_json_from_array(my_array)
			json = my_array.to_json
			return json
	end


	def get_deadlines_from_ical(cal_file)

		check_ical(cal_file)

		deadlines = parse_ical(cal_file)

		if deadlines != nil
			json = generate_json_from_array(deadlines)
			return json
		end

		return '[]'
	end
end

# will only work if calendar path given in
if ARGV.empty?
  puts 'Usage: icallme.rb session_name [-v]' # i.e. icallme.rb audio-001 1432
  exit 1
end

session_name = ARGV.shift
mooc_id = ARGV.shift
user_id = ARGV.shift
verbose_mode = ARGV.shift == "-v" ? true : false

boss = ICallMe.new(session_name, mooc_id, user_id, verbose_mode)
boss.do_the_job() ## Yeah. Fuck Yeah. Do it. Q____


