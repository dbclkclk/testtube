class CreateStoryTasks < ActiveRecord::Migration
  def change
    create_table :story_tasks do |t|
      t.references :BaselineTask
      t.references :UserStory
      t.boolean :is_overridden
      t.string :name
      t.text :description
      t.decimal :doit_loe_hours, :precision => 10, :scale => 2

      t.timestamps
    end
    add_index :story_tasks, :BaselineTask_id
    add_index :story_tasks, :UserStory_id
  end
end