require 'socket'
require 'erb'
require 'net/http'
require 'uri'
require 'json'

include ERB::Util

class RentrakInfoGetter
  def initialize
    @host = 'boxoffice.rentrak.com'
    @port = 80

    @token = ""
    @cookie = ""
    @key = "AIzaSyCUFdO_BtmNQg0YRsE5PEYobe8JE8OTkIM"

    @currentWeekHeaders = Array.new

    @headers =
    "Host: boxoffice.rentrak.com\n" +
    "Connection: keep-alive\n" +
    "Content-Length: 65\n" +
    "Cache-Control: max-age=0\n" +
    "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8\n" +
    "Origin: http://boxoffice.rentrak.com\n" +
    "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/33.0.1750.152 Safari/537.36\n" +
    "Content-Type: application/x-www-form-urlencoded\n" +
    "Accept-Encoding: gzip,deflate,sdch\n" +
    "Accept-Language: en-US,en;q=0.8,fr;q=0.6\n"
  end

  def doLoginRequest
    s = TCPSocket.open @host, @port
    s.puts "POST /boxoffice_essentials_login.html HTTP/1.1\r\n"
    s.puts @headers
    s.puts "Cookie: _referrer_og=https%3A%2F%2Fwww.google.com%2F; _jsuid=1616249673; __utma=227188638.385097425.1396122786.1396122786.1396122787.2; __utmc=227188638; __utmz=227188638.1396122787.2.2.utmcsr=www.rentrak.com|utmccn=(not%20set)|utmcmd=(not%20set); __utma=183032501.538269636.1396121871.1396193288.1396204321.5; __utmb=183032501.3.10.1396204321; __utmc=183032501; __utmz=183032501.1396121871.1.1.utmcsr=(direct)|utmccn=(direct)|utmcmd=(none);"
    s.puts "\r\n"
    s.puts "bad_login_count=&login_id=mascher&password=Q447UyXv54R6&B1=Log+In"
    s.puts "\r\n"

    # Read response and extract @cookie, authenticity @token
    while line = s.gets
      if line.index('AF_SID_boxoffice_rentrak_com=') != nil
        puts "---- @COOKIE ----"
        @cookie = line.match(/AF_SID_boxoffice_rentrak_com=[^;]*/)
        puts @cookie
        puts "------------"
      end
    end
    s.close
  end

  def doTheaterInfoRequest
    s = TCPSocket.open @host, @port
    s.puts "GET /theatrical/theaters/theater_lookup.html?dma_no=ALL&exact_theater_match=1&week_range=&week_range=&week_range=&reporting_status=&coc_id=ALL&branch=ALL&open_status=Y&search_keywords=&no_paging=1 HTTP/1.1\r\n"
    s.puts @headers
    s.puts "Cookie: _referrer_og=https%3A%2F%2Fwww.google.com%2F; _jsuid=1616249673; __utma=227188638.385097425.1396122786.1396122786.1396122787.2; __utmc=227188638; __utmz=227188638.1396122787.2.2.utmcsr=www.rentrak.com|utmccn=(not%20set)|utmcmd=(not%20set); #{@cookie}; __utma=183032501.538269636.1396121871.1396193288.1396204321.5; __utmb=183032501.4.10.1396204321; __utmc=183032501; __utmz=183032501.1396121871.1.1.utmcsr=(direct)|utmccn=(direct)|utmcmd=(none)"
    s.puts "\r\n"

    f = File.new("rentrak.json", "w+")
    f.puts "{"
    f.puts "\"type\": \"FeatureCollection\","
    f.puts "\"features\": ["

    puts "+----------------+--------------------------------------------+------------------------------------------------------------+"
    puts "|     Number     |                   Theater                  |                          Address                           |"
    puts "+----------------+--------------------------------------------+------------------------------------------------------------+"

    while line = s.gets
      count = 0
      # Reached the beginning of a table row
      if (line.index("table id=\"dataTable"))
        while line = s.gets
          if (line.index("<tr class=\"body"))

            # 1st column - extract theater number
            theaterNumber = line.scan(/theater_no=(\d+)"/)[0][0]

            # 2nd column - extract theater name
            info = line.scan(/>([^<]+)<\//)
            name = info[0][0]

            # 3rd column - extract theater address
            city = info[2][0]
            state = info[3][0]
            address = info[1][0] + ", " + city + ", " + state

            numberPadding = 12 - theaterNumber.length
            namePadding = 40 - name.length
            addressPadding = 59 - address.length
            if (state.index("CA"))
              # Create GSON object for theater
              if count != 0
                f.puts ",\n"
              end
              f.puts "{\"type\": \"Feature\", \n \"properties\": {"
              count += 1
              puts "|    #{theaterNumber}#{' '*numberPadding}|    #{name}#{' '*namePadding.abs}| #{address}#{' '*addressPadding.abs}|"

              addressGoog = address.gsub(/\s+/, '+')
              url = "https://maps.googleapis.com/maps/api/geocode/json?address=#{addressGoog}&key=#{@key}&sensor=false"
              puts url

              uri = URI.parse(url)
              http = Net::HTTP.new(uri.host, uri.port)
              http.use_ssl = true
              req = Net::HTTP::Get.new(uri.request_uri)

              res = http.request(req)
              data = JSON.parse(res.body)
              location = data["results"][0]["geometry"]["location"]
              puts location

              lat = location["lat"]
              long = location["lng"]

              f.puts "\"rentrak_id\": \"#{theaterNumber}\", \"name\": \"#{name}\", \"address\": \"#{address}\"},"
              f.puts "\"geometry\": {"
              f.puts "\"type\": \"Point\","
              f.puts "\"coordinates\": [#{long}, #{lat}]"
              f.puts "}}"
            end
          end
        end
        puts "+----------------+--------------------------------------------+------------------------------------------------------------+"      end
    end
    f.puts "]}"
    puts "Number of theaters: #{count}"
    s.close
  end

  def parseTableHeader(table)
    headers = Array.new
    # Get headers for table
    if headers.empty?
      headerEl = table.match(/<tr class="">.+?<\/tr>/m)[0]
      headerEl.scan(/>([^"]+)<\/a/) do |match|
        match = match[0].gsub(/<br \/>/, ' ')
        if (match == "%")
          match = "%#{headers[headers.length - 1]}"
        end
        headers.push(match)
      end
    end
    return headers
  end

  # Creates an array of objects based on the table. The header values
  # correspond to keys in the table, the rows correspond to objects,
  # the columns correspond to the objects value that corresponds to the
  # header key.
  def parseTable(table, headers)
    addNext = false
    objects = Array.new
    table.scan(/<tr class="body.+?<\/tr>/m) do |row|
      object = Hash.new
      index = 0
      row.scan(/>([^<]+)<\//) do |d|
        object[headers[index]] = d[0]
        index += 1
      end
      objects.push(object)
    end
    return objects
  end

  def doBoxOfficeRequest(id)
    url = "http://boxoffice.rentrak.com/theatrical/theaters/menu_theater_detail.html?theater_no=#{id}"
    uri = URI.parse(url)
    http = Net::HTTP.new(uri.host, uri.port)
    req = Net::HTTP::Get.new(uri.request_uri)
    req["Cookie"] = "_referrer_og=https%3A%2F%2Fwww.google.com%2F; _jsuid=1616249673; __utma=227188638.385097425.1396122786.1396122786.1396122787.2; __utmc=227188638; __utmz=227188638.1396122787.2.2.utmcsr=www.rentrak.com|utmccn=(not%20set)|utmcmd=(not%20set); __utma=183032501.538269636.1396121871.1396364604.1396366417.9; __utmb=183032501.13.10.1396366417; __utmc=183032501; __utmz=183032501.1396121871.1.1.utmcsr=(direct)|utmccn=(direct)|utmcmd=(none); #{@cookie}"

    res = http.request(req)
    table = res.body.match(/<table id="dataTable".+?<\/table>/m)
    movies = [];
    if (table != nil)
      if @currentWeekHeaders.empty?
        @currentWeekHeaders = parseTableHeader(table[0])
      end
      movies = parseTable(table[0], @currentWeekHeaders)
    end

    packet = {"headers" => @currentWeekHeaders, "movies"=> movies}
    return packet
  end
end

infoGetter = RentrakInfoGetter.new
puts infoGetter.doLoginRequest
infoGetter.doBoxOfficeRequest(991355)
# doTheaterInfoRequest



