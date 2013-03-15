class UserStoriesController < ApplicationController
  def show
  end

  def index
    # identify which drawers should be in the chest
    @slider_drawers = build_drawers
  end

  def new
  end

  def create
  end

  def build_drawers
    retval = []

    drawer = {\
      :partial_name => "drawer_filters"\
      , :drawer_header => "Filters"\
      , :handle_text => "filters"\
    }
    retval.push(drawer)

    drawer = {\
      :partial_name => "drawer_assign_to_buckets"\
      , :drawer_header => "Work Buckets"\
      , :handle_text => "buckets"\
    }
    retval.push(drawer)

    drawer = {\
      :partial_name => "drawer_cheat_sheet"\
      , :drawer_header => "Cheat Sheet"\
      , :handle_text => "cheat"\
    }
    retval.push(drawer)

    return retval
  end
end
