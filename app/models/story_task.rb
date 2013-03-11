class StoryTask < ActiveRecord::Base
  belongs_to :BaselineTask
  belongs_to :UserStory
  attr_accessible :description, :doit_loe_hours, :is_overridden, :name
end
