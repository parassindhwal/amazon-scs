const db = require("../configs/mysql_db");
const File = db.file;
const Directory = db.directory;

const validateFolderPath = (folder_path) => {
  const folder_path_arr = folder_path.split("/");
  for (let folder of folder_path_arr) {
    if (!folder.length) {
      return { isValid: false, message: "Invalid folder name or folder path" };
    }
  }
  return { isValid: true, folder_path_arr };
};

const validateParentDirectoryID = (parent_directory_id, folder_path_arr) => {
  if ((!parent_directory_id || typeof parent_directory_id !== "number") && folder_path_arr.length > 1) {
    return { isValid: false, message: "Parent directory id is required for nested directories" };
  }
  return { isValid: true };
};

const createDirectoryInDB = async (folder_path, main_folder_name, parentDirectoryID, user_id) => {
  return await Directory.create({
    directory_name: main_folder_name,
    parent_directory_id: parentDirectoryID,
    directory_path: folder_path,
    user_id: user_id,
  });
};

const checkDuplicateDirectory = async (folder_path, main_folder_name, user_id) => {
  const existingDirectories = await Directory.findAll({
    where: { directory_path: folder_path, directory_name: main_folder_name, user_id: user_id },
  });
  return existingDirectories.length !== 0;
};

const checkParentDirectory = async (parentDirectoryID, folder_path, user_id) => {
  const parentDirectoryStatus = await Directory.findOne({
    where: { id: parentDirectoryID, user_id: user_id },
  });

  if (!parentDirectoryStatus) {
    return { isValid: false, message: "Parent directory Not Found" };
  }

  const expectedParentPath = folder_path.slice(0, folder_path.lastIndexOf("/"));
  if (parentDirectoryStatus.directory_path !== expectedParentPath) {
    return { isValid: false, message: "Parent directory path is invalid" };
  }

  return { isValid: true };
};

// helper function present in this handler are declare above
const createDirectory = async (req, res) => {
  try {
    const { parent_directory_id, folder_path } = req.body;

    // Validate folder path
    const { isValid: isPathValid, folder_path_arr, message: pathErrorMessage } = validateFolderPath(folder_path);
    if (!isPathValid) {
      return res.status(400).json({ success: false, message: pathErrorMessage });
    }

    const main_folder_name = folder_path_arr[folder_path_arr.length - 1];
    const user_id = req.user.id;

    // Root-level directory creation
    if (!parent_directory_id && folder_path_arr.length === 1) {
      const newDirectory = await createDirectoryInDB(folder_path, main_folder_name, null, user_id);
      return res.status(200).json({
        success: true,
        message: "Directory created successfully",
        directory: newDirectory,
      });
    }

    // Validate parent directory ID for nested directories
    const { isValid: isParentIDValid, message: parentIDErrorMessage } = validateParentDirectoryID(parent_directory_id, folder_path_arr);
    if (!isParentIDValid) {
      return res.status(400).json({ success: false, message: parentIDErrorMessage });
    }

    const parentDirectoryID = parseInt(parent_directory_id);

    // Validate parent directory exists and matches path
    const { isValid: isParentValid, message: parentErrorMessage } = await checkParentDirectory(parentDirectoryID, folder_path, user_id);
    if (!isParentValid) {
      return res.status(400).json({ success: false, message: parentErrorMessage });
    }

    // Check for duplicate directories
    const isDuplicate = await checkDuplicateDirectory(folder_path, main_folder_name, user_id);
    if (isDuplicate) {
      return res.status(400).json({
        success: false,
        message: "Cannot create a directory with the same name in the same path.",
      });
    }

    // Create directory
    const newDirectory = await createDirectoryInDB(folder_path, main_folder_name, parentDirectoryID, user_id);
    return res.status(200).json({
      success: true,
      message: "Directory created successfully",
      directory: newDirectory,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ---------------------------------------------------------------- Create Directory ---------------------------------------------------------------- //

const getUserDirectories = async (req, res) => {
    try {
      // Get user ID from the token
      const userId = req.user.id;
  
      // Find directories associated with the user
      const directories = await Directory.findAll({ where: { user_id: userId } });
  
      // If no directories found, respond with an error message
      if (!directories || directories.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No directories found for the user'
        });
      }
  
      // Respond with the list of directories
      res.status(200).json({
        success: true,
        totalCount: directories.length,
        directories: directories
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  const getFilesInDirectory = async (req, res) => {
    try {
      // Extract directory ID from URL parameters
      const directoryId = req.params.directoryId;
  
      // Verify user ID from the token
      const userId = req.user.id;
  
      let folder = 'No external folders.';
  
      // Check if the directory belongs to the user
      const directory = await Directory.findOne({ where: { id: directoryId, user_id: userId } });
      if (!directory) {
        return res.status(404).json({
          success: false,
          message: 'Directory not found or does not belong to the user'
        });
      }
  
      // Find files within the directory
      const files = await File.findAll({ where: { directory_id: directoryId, user_id: userId, priority_version: true } });
  
      let totalCount = files.length;
  
      // Find Folders within the directory
      const folders = await Directory.findAll({ where: {parent_directory_id: directoryId, user_id: userId} })
      
    //   if(folders && folders.parent_directory_id){
    //     folder = folders.directory_name;
    //     totalCount = files.length + 1;
    //   }
  
      // Respond with the list of files
      res.status(200).json({
        success: true,
        totalCount: files.length + folders.length,
        files: files,
        folders: folders
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };  
  

module.exports = {
  createDirectory,
  getUserDirectories,
  getFilesInDirectory
};
