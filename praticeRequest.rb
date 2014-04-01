require "net/http"
require "uri"
require "json"

url = "https://maps.googleapis.com/maps/api/geocode/json?address=22311+Bear+Valley+Road+Bldg+A,+Apple+Valley,+CA&sensor=false&key=AIzaSyCUFdO_BtmNQg0YRsE5PEYobe8JE8OTkIM"

uri = URI.parse(url)
http = Net::HTTP.new(uri.host, uri.port)
http.use_ssl = true
req = Net::HTTP::Get.new(uri.request_uri)

res = http.request(req)
data = JSON.parse(res.body)
puts data["results"][0]["geometry"]["location"]
