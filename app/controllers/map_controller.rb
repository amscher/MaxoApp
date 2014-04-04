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
end
