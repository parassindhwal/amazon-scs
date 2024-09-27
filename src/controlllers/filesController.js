const db = require("../configs/mysql_db");
const path = require("path");
const fs = require("fs");
var File = db.file;
var Directory = db.directory;
var FilePermission = db.permission;
var FileVersion = db.fileVersion;
var FileMetadata = db.fileMetadata;
var User = db.user;
const { Op } = require('sequelize');

const removeFile = (req) => {
  for (const file of req.files) {
    const { filename } = file;
    const userUploadsFolder = `uploads/user_${req.user.id}/${filename}`;
    fs.unlink(userUploadsFolder, (err) => {
      if (err) {
        console.error("Error deleting file:", err);
      }
    });
  }
};

const uploadFile = async (req, res) => {
  try {
    const { folder_name, folder_path } = req.body;

    if (
      !folder_name ||
      folder_name.trim().length == 0 ||
      !folder_path ||
      folder_path.trim().length == 0
    ) {
      removeFile(req);
      return res.status(400).json({
        success: false,
        message: "Folder name or folder path is invalid",
      });
    }

    // Checing the folder name and folder path
    const folder_path_arr = folder_path.split("/");
    const main_folder_name = folder_path_arr[folder_path_arr.length - 1];

    if (folder_name === main_folder_name) {
      let directory = await Directory.findOne({
        where: {
          directory_name: folder_name,
          directory_path: folder_path,
          user_id: req.user.id,
        },
      });

      if (!directory) {
        removeFile(req);
        return res.status(404).json({
          success: false,
          message: "Folder name or folder path does not match",
        });
      }

      // Process each upload file
      const filesData = [];

      for (const file of req.files) {
        console.log(file);
        const { filename, size, mimetype } = file;
        const userId = req.user.id;

        const uploadsFolderPath = path.join(
          __dirname,
          "..",
          "..",
          "uploads",
          `user_${userId}`
        );

        const filePath = path.join(uploadsFolderPath, filename);

        const firstHypenIndex = filename.indexOf("-");
        const originalFilename = filename.substring(firstHypenIndex + 1);

        let existingFile = await File.findOne({
          where: {
            file_name: originalFilename,
            directory_id: directory.id,
            user_id: userId,
          },
          include: [{
            model: FileVersion,
            where: { priority_version: true },
          }],
        });

        
        if (existingFile) {
          let version = await FileVersion.findOne({
            where:{priority_version: true, file_id: existingFile.id}
          })
          const versionNumber =
            (await FileVersion.max("version_number", {
              where: { file_id: existingFile.id },
            })) + 1 || 1;
          // const newFilePath = filePath + "\\v" + versionNumber;
          // const newFilePath = path.join(filePath, `v${versionNumber}`);

          console.log(version);

          await FileVersion.update(
            { priority_version: false },
            {
              where: {
                id: version.id,
              },
            }
          );

          const newFileVersion = await FileVersion.create({
            file_id: existingFile.id,
            user_id: req.user.id,
            version_number: versionNumber,
            file_path: filePath,
            upload_date: new Date(),
            file_size: size,
            system_generated_file_name: filename,
          });

          filesData.push({
            file: existingFile,
            fileVersion: newFileVersion,
          });
        } else {
          // If no file with the same name exists, upload as a new file
          console.log(mimetype, "mime-type");
          const uploadedFile = await File.create({
            file_name: originalFilename,
            directory_id: directory.id,
            user_id: req.user.id,
            upload_date: new Date(),
            file_type: mimetype,
          });

          // Create the initial version of the file
          const initialFileVersion = await FileVersion.create({
            file_id: uploadedFile.id,
            version_number: 1,
            user_id: req.user.id,
            file_path: filePath,
            file_size: size,
            system_generated_file_name: filename,
            upload_date: new Date(),
          });

          // Give private permission to the file
          await FilePermission.create({
            file_id: uploadedFile.id,
            user_id: req.user.id,
          });

          // Store file data
          filesData.push({
            file: uploadedFile,
            fileVersion: initialFileVersion,
          });
        }
      }
      // Respond with success message
      res.status(200).json({
        success: true,
        message: "File uploaded successfully",
        file: filesData,
      });

      console.log("File Uploaded Successfully");
    } else {
      removeFile(req);
      return res.status(400).json({
        success: false,
        message: "Folder name in folder path does not match",
      });
    }
  } catch (error) {
    removeFile(req);
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const downloadFile = async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const userId = req.user.id;
    let activeFile;

    let file = await File.findOne({
      where: {
        id: fileId,
      },
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    } else {
      activeFile = await FileVersion.findOne({
        where: { file_id: file.id, priority_version: true },
      });
    }

    const permissionDetails = await FilePermission.findOne({
      where: { file_id: fileId },
    });
    if (!permissionDetails) {
      return res.status(404).json({
        success: false,
        message: "Permission details not found",
      });
    }

    const permissionType = permissionDetails.permission_type;
    const permissionEmail = permissionDetails.shared_with
      .split(",")
      .map((email) => email.trim());

    const download = async () => {
      let filePath = activeFile.file_path;
      // filePath = filePath.slice(0, filePath.lastIndexOf("\\"));

      fs.access(filePath, fs.constants.F_OK, async (err) => {
        if (err) {
          return res.status(404).json({
            success: false,
            message: "File not found on server",
          });
        }

        // Set the headers to indicate a file download
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${file.file_name}"`
        );
        res.setHeader("Content-Type", file.file_type);

        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

        fileStream.on("error", (err) => {
          console.error("Error reading file:", err);
          return res.status(500).json({
            success: false,
            message: "Error downloading file",
          });
        });

        // Update download count
        file.download_count + 1;
        await file.save();
        console.log(`File "${file.file_name}" downloaded by user ${userId}`);
      });
    };

    // Check permissions and download
    if (permissionType === "Private" && file.user_id === userId) {
      download();
    } else if (permissionType === "Public") {
      download();
    } else if (
      permissionType === "Shared" &&
      (permissionEmail.includes(req.user.email) || file.user_id === req.user.id)
    ) {
      download();
    } else {
      return res.status(403).json({
        success: false,
        message: "User does not have permission to access this file",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const listFiles = async (req, res) => {
  try {
    const userId = req.user.id;

    const files = await FileVersion.findAll({
      where: {
        user_id: userId,
        priority_version: true,
      },
    });

    if (!files) {
      return res.status(404).json({
        success: false,
        message: "No files were found",
      });
    }

    res.status(200).json({
      success: true,
      totalCount: files.length,
      files: files,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const searchFiles = async (req, res) => {
  try {
    const userID = req.user.id;

    const { keyword } = req.query;

    const filesByFilename = await File.findAll({
      where: {
        user_id: userID,
        file_name: { [db.Sequelize.Op.like]: `%${keyword}%` },
      },
    });

    const filesByMetadata = await FileMetadata.findAll({
      where: {
        metadata_value: { [db.Sequelize.Op.like]: `%${keyword}%` },
      },
      includes: [
        {
          model: File,
          as: "file",
          where: { user_id: userID, priority_version: true },
        },
      ],
    });

    const matchingFiles = [...filesByFilename, ...filesByMetadata];

    if (matchingFiles.length === 0) {
      res.status(404).json({
        success: false,
        message: "No matching files",
      });
    } else {
      res.status(200).json({
        success: true,
        files: matchingFiles,
        totalCount: matchingFiles.length,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const setFilePermissions = async (req, res) => {
  try {
    const { fileId } = req.params;
    const { permission, shared_with_user } = req.body;
    const currentUserEmail = req.user.email;

    let updatedPermissionStr =
      permission.charAt(0).toUpperCase() + permission.slice(1);

    if (updatedPermissionStr.trim().length == 0) {
      return res.status(400).json({
        success: false,
        message: "Incorrect body or field missing",
      });
    }

    let fileExistance = await File.findOne({
      where: { user_id: req.user.id, id: fileId },
    });
    if (!fileExistance || typeof fileExistance == null) {
      res.status(404).json({
        status: false,
        message:
          "No file found with the provided fileId or file don't belongs to the user",
      });
    }

    // Update permissions for the file in the database
    var result = await updateFilePermissions(
      fileId,
      updatedPermissionStr,
      shared_with_user,
      currentUserEmail
    );

    if (result && result[0].length == 0 && result[1].length == 0) {
      res.status(200).json({
        success: true,
        message: `Permissions updated successfully updated`,
      });
    }

    // Respond with success message
    if (
      updatedPermissionStr === "Private" ||
      updatedPermissionStr === "Public"
    ) {
      res.status(200).json({
        success: true,
        message: "Permissions updated successfully",
      });
    } else {
      res.status(200).json({
        success: true,
        message: `Permissions updated successfully for these emails - ${result[0]}`,
        email_not_found: `Permission not updated for these emails - ${result[1]}`,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Function to update permission for the file
const updateFilePermissions = async (
  fileId,
  permission,
  shared_with_user,
  currentUserEmail
) => {
  try {
    const userEmails = shared_with_user;

    if (permission === "Shared") {
      // Find users matching the provided emails
      const usersData = await User.findAll({
        attributes: ["id", "email"],
        where: {
          email: {
            [db.Sequelize.Op.in]: userEmails,
          },
        },
      });

      if (!usersData || usersData.length == 0) {
        throw new Error(
          "No user found with the provided email address in the database"
        );
      }

      const existingEmails = usersData.map((user) => user.email);
      const missingEmails = userEmails.filter(
        (email) => !existingEmails.includes(email)
      );

      // Remove missing emails from shared_with_user
      const result = existingEmails.join(", ");
      const no_result = missingEmails.join(", ");

      // Remove email of current user if found
      emailString = result.replace(currentUserEmail + ", ", "");

      if (currentUserEmail.trim() == result.trim()) {
        (permission = "Private"), (emailString = "");
      }

      // Update file permissions
      await FilePermission.update(
        {
          permission_type: permission,
          shared_with: emailString,
        },
        {
          where: { file_id: fileId },
        }
      );

      console.log("File permissions updated successfully");
      return [emailString, no_result];
    } else if (permission === "Public" || permission === "Private") {
      // Update file permissions
      await FilePermission.update(
        {
          permission_type: permission,
          shared_with: "",
        },
        {
          where: { file_id: fileId },
        }
      );
      console.log("File permissions updated successfully");
    } else {
      throw new Error(
        "Error updating file permissions: Invalid permission given"
      );
    }
  } catch (error) {
    console.error("Error updating file permissions:", error);
  }
};

const getAllFileVersion = async (req, res) => {
  try {
    const { fileId } = req.params;

    // Retrieve all versions of the file from the database
    const fileVersions = await FileVersion.findAll({
      where: { file_id: fileId, user_id: req.user.id},
      attributes: ["id", "version_number", "file_path", "upload_date"],
      order: [["upload_date", "DESC"]], // Order by upload date in descending order
    });

    if (!fileVersions || fileVersions.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No versions found for the specified file or file not found",
      });
    }

    // Respond with the array of file versions
    res.status(200).json({
      success: true,
      message: "File versions retrieved successfully",
      totalCount: fileVersions.length,
      fileVersions,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getFileVersion = async (req, res) => {
  try {
    const { fileId, versionId } = req.params;

    // Find the file version in the database by fileId and versionId
    const fileVersion = await FileVersion.findOne({
      where: { file_id: fileId, id: versionId },
    });

    // If the file version is not found, return a 404 Not Found response
    if (!fileVersion) {
      return res.status(404).json({
        success: false,
        message: "File version or file not found",
      });
    }

    // Respond with the file version object
    res.status(200).json({
      success: true,
      fileVersion,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const restoreFileVersion = async (req, res) => {
  try {
    const { fileId, versionId } = req.params;

    // Find the file version in the database by fileId and versionId
    const fileVersion = await FileVersion.findOne({
      where: { file_id: fileId, id: versionId, user_id: req.user.id },
    });

    // If the file version is not found, return a 404 Not Found response
    if (!fileVersion) {
      return res.status(404).json({
        success: false,
        message: "File version or file not found ",
      });
    } else if (fileVersion.priority_version) {
      return res.status(400).json({
        success: false,
        message: "File version is already active",
      });
    }

    await FileVersion.update(
      { priority_version: true },
      {
        where: {
          id: versionId,
        },
      }
    );
    const filesToBeDeleted = await FileVersion.findAll({
      attributes: ['file_path'],
      where: {
        version_number: {
          [Op.gt]: fileVersion.version_number,
        },
        file_id: fileId
      },
    });


    for (const file of filesToBeDeleted) {
      // Construct the file path in the uploads folder
      const path = file.file_path;
      // const lastIndex = path.lastIndexOf("/");
      // const realFilePath = path.substring(0, lastIndex);

      // Check if the path exists
      if (fs.existsSync(path)) {
        fs.unlink(path, (err) => {
          if (err) {
            console.error("Error deleting file:", err);
          }
        });
      }
    }

    await FileVersion.destroy({
      where: {
        version_number: {
          [Op.gt]: fileVersion.version_number,
        },
        file_id: fileId
      },
    });

    // Respond with success message
    res.status(200).json({
      success: true,
      message: "File version restored successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const addFileMetadata = async (req, res) => {
  try {
    const { fileId } = req.params;
    const metadata = req.body;

    // Validate request
    if (!metadata || typeof metadata !== "object") {
      return res.status(400).json({
        success: false,
        message: "Metadata should be a JSON object.",
      });
    }

    // Add metadata to the file
    const addedMetadata = [];
    for (const [key, value] of Object.entries(metadata)) {
      const newMetadata = await FileMetadata.create({
        file_id: fileId,
        metadata_key: key,
        metadata_value: value,
      });
      addedMetadata.push(newMetadata);
    }

    res.status(200).json({
      success: true,
      message: "Metadata added successfully",
      addedMetadata,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const deleteFiles = async (req, res) => {
  try {
    const { ids } = req.body;
    // const { type, ids } = req.body;
    let allFilesData;

    if (!Array.isArray(ids) || !ids.length) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid request body." });
    }

    allFilesData = await File.findAll({
      attributes: ["id", "file_name"],
      where: {
        id: ids,
        user_id: req.user.id,
      },
    });

    if (allFilesData.length) {
      let activeFiles = await FileVersion.findAll({
        attributes: ["id", "file_path"],
        where: { file_id: ids },
      });
      await File.destroy({ where: { id: ids } });
      for (const file of activeFiles) {
        // Construct the file path in the uploads folder
        const path = file.file_path;
        // const lastIndex = path.lastIndexOf("/");
        // const realFilePath = path.substring(0, lastIndex);

        // Check if the path exists
        if (fs.existsSync(path)) {
          fs.unlink(path, (err) => {
            if (err) {
              console.error("Error deleting file:", err);
            }
          });
        }
      }
      return res
        .status(200)
        .json({ success: true, message: "Files deleted successfully." });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "No Files were found." });
    }
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error." });
  }
};

module.exports = {
  uploadFile,
  downloadFile,
  listFiles,
  searchFiles,
  setFilePermissions,
  getAllFileVersion,
  getFileVersion,
  restoreFileVersion,
  addFileMetadata,
  deleteFiles,
};