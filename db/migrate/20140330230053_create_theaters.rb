class CreateTheaters < ActiveRecord::Migration
  def change
    create_table :theaters do |t|
      t.string :rentrak_id
      t.string :name
      t.string :address
      t.integer :lat
      t.integer :long

      t.timestamps
    end
  end
end
