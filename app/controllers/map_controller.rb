require 'rentrak'

class MapController < ApplicationController
  def show
  end

  def index
    @data = File.read("rentrak.json")
    render :json => @data
  end

  def theater_info
    if @infoGetter == nil
      @infoGetter = RentrakInfoGetter.new
      @infoGetter.doLoginRequest
    end
    hash = @infoGetter.doBoxOfficeRequest(params[:id])
    puts hash.to_json
    render json: hash
  end

  def population_info
    url = "http://data.fcc.gov/api/block/find?latitude=#{params[:latitude]}&longitude=#{params[:longitude]}&format=json";
    puts url

    uri = URI.parse(url)
    http = Net::HTTP.new(uri.host, uri.port)
    req = Net::HTTP::Get.new(uri.request_uri)

    res = http.request(req)
    puts res.body
    render json: res.body
  end
end
