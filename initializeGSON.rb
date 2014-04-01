require 'socket'
require 'erb'

include ERB::Util

@host = 'boxoffice.rentrak.com'
@port = 80

@token = ""
@cookie = ""

def doGetRequest
  s = TCPSocket.open @host, @port
  s.puts "POST /boxoffice_essentials_login.html HTTP/1.1\r\n"
  s.puts "Host: boxoffice.rentrak.com"
  s.puts "Connection: keep-alive"
  s.puts "Content-Length: 65"
  s.puts "Cache-Control: max-age=0"
  s.puts "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
  s.puts "Origin: http://boxoffice.rentrak.com"
  s.puts "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/33.0.1750.152 Safari/537.36"
  s.puts "Content-Type: application/x-www-form-urlencoded"
  # s.puts "Referer: http://boxoffice.rentrak.com/index.html?logout=1"
  s.puts "Accept-Encoding: gzip,deflate,sdch"
  s.puts "Accept-Language: en-US,en;q=0.8,fr;q=0.6"
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

  s = TCPSocket.open @host, @port
  s.puts "GET /theatrical/theaters/theater_lookup.html?dma_no=ALL&exact_theater_match=1&week_range=&week_range=&week_range=&reporting_status=&coc_id=ALL&branch=ALL&open_status=Y&search_keywords=&no_paging=1 HTTP/1.1\r\n"
  s.puts "Host: boxoffice.rentrak.com"
  s.puts "Connection: keep-alive"
  s.puts "Cache-Control: max-age=0"
  s.puts "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
  s.puts "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/33.0.1750.152 Safari/537.36"
  s.puts "Referer: http://boxoffice.rentrak.com/boxoffice_essentials_login.html?redirect_to=%2Ftheatrical%2Ftheaters%2Ftheater_lookup.html%3Fdma_no%3DALL%3Bexact_theater_match%3D1%3Bweek_range%3D%3Bweek_range%3D%3Bweek_range%3D%3Breporting_status%3D%3Bcoc_id%3DALL%3Bbranch%3DALL%3Bopen_status%3DY%3Bsearch_keywords%3D%3Bno_paging%3D1"
  s.puts "Accept-Encoding: gzip,deflate,sdch"
  s.puts "Accept-Language: en-US,en;q=0.8,fr;q=0.6"
  s.puts "Cookie: _referrer_og=https%3A%2F%2Fwww.google.com%2F; _jsuid=1616249673; __utma=227188638.385097425.1396122786.1396122786.1396122787.2; __utmc=227188638; __utmz=227188638.1396122787.2.2.utmcsr=www.rentrak.com|utmccn=(not%20set)|utmcmd=(not%20set); #{@cookie}; __utma=183032501.538269636.1396121871.1396193288.1396204321.5; __utmb=183032501.4.10.1396204321; __utmc=183032501; __utmz=183032501.1396121871.1.1.utmcsr=(direct)|utmccn=(direct)|utmcmd=(none)"
  s.puts "\r\n"

  # f = File.new("renTrakIndex.html", "w+")
  # # Read response and extract @cookie, authenticity @token
  # while line = s.gets
  #   puts line
  #   f.puts line
  # end

  puts "+----------------+--------------------------------------------+------------------------------------------------------------+"
  puts "|     Number     |                   Theater                  |                          Address                           |"
  puts "+----------------+--------------------------------------------+------------------------------------------------------------+"

  while line = s.gets
    count = 0
    # Reached the beginning of a table row
    if (line.index("table id=\"dataTable"))
      while line = s.gets
          if (line.index("<tr class=\"body"))
            count += 1
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
            puts "|    #{theaterNumber}#{' '*numberPadding}|    #{name}#{' '*namePadding.abs}| #{address}#{' '*addressPadding.abs}|"
          end
        end
        puts "+----------------+--------------------------------------------+------------------------------------------------------------+"      end
  end
  puts "Number of theaters: #{count}"
  s.close
end

doGetRequest