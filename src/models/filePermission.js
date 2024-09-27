module.exports = (sequelize, DataTypes) => {
    const FilePermissions = sequelize.define('File_Permission', {
      file_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'files',
          key: 'id'
        }
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      permission_type: {
        type: DataTypes.ENUM('Private', 'Public', 'Shared'),
        allowNull: false,
        defaultValue: 'Private'
      },
      shared_with: {
        type: DataTypes.STRING,
        defaultValue: ''
      }
    },{
      indexes: [
        {
          unique: true,
          fields: ['file_id', 'user_id', 'shared_with']
        }
      ],
    });
  
    return FilePermissions;
  };