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
    # infoGetter.doBoxOfficeRequest(params[:id])
    render text: @infoGetter.doBoxOfficeRequest(params[:id])
  end
end
