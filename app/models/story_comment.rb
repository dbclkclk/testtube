class StoryComment < ActiveRecord::Base
  belongs_to :UserStory
  attr_accessible :comment, :comment_type, :is_satisfied
  
  validates :comment, :comment_type, :presence => true

  COMMENTTYPE_acceptance = "acceptance"
  COMMENTTYPE_feedback = "feedback"
  COMMENTTYPE_question = "question"
  COMMENTTYPE_spec = "spec"
  COMMENTTYPE_remark = "remark"

  ALL_COMMENTTYPES = [COMMENTTYPE_acceptance \
    , COMMENTTYPE_feedback \
    , COMMENTTYPE_question \
    , COMMENTTYPE_remark \
    , COMMENTTYPE_spec]

  validates_inclusion_of :comment_type, :in => ALL_COMMENTTYPES
end
