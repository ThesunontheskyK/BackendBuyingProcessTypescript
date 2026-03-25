import fs from 'fs';
import path from 'path';

/**
 * จัดรูปแบบ Object สำหรับเก็บข้อมูลไฟล์ใน Database
 */
export const formatFileSaveObject = (files: any[], type: string) => {
    if (!files || files.length === 0) return null;

    const fileList = files.map((file: any) => ({
        fileName: file.originalname,
        fileSave: file.filename,
        fileType: file.mimetype
    }));

    return {
        File_Location: `/public/${type}`,
        File_Save: fileList
    };
};

/**
 * ลบไฟล์จริงๆ ออกจากเครื่องเซิร์ฟเวอร์
 */
export const deletePhysicalFile = (location: string, fileName: string) => {
    try {
        const filePath = path.join(process.cwd(), location, fileName);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return true;
        }
    } catch (error) {
        console.error(`Error deleting file ${fileName}:`, error);
    }
    return false;
};

/**
 * ลบไฟล์ที่เพิ่งอัปโหลดเข้ามา (ใช้ตอน Error)
 */
export const cleanupUploadedFiles = (files: any[]) => {
    if (!files || files.length === 0) return;
    for (const file of files) {
        try {
            const filePath = path.join(process.cwd(), file.path);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (error) {
            console.error("Error cleaning up file:", error);
        }
    }
};

/**
 * จัดการรวมไฟล์เก่า-ใหม่ และลบไฟล์ที่ต้องการทิ้ง
 */
export const processFileUpdates = (existingFileObj: any, newFiles: any[], deleteFiles: string[], type: string) => {
    let finalObj = existingFileObj || { File_Location: `/public/${type}`, File_Save: [] };

    // 1. ลบไฟล์เก่าออก
    if (finalObj.File_Save && deleteFiles.length > 0) {
        finalObj.File_Save = finalObj.File_Save.filter((f: any) => {
            if (deleteFiles.includes(f.fileSave)) {
                deletePhysicalFile(finalObj.File_Location, f.fileSave);
                return false;
            }
            return true;
        });
    }

    // 2. รวมไฟล์ใหม่
    const newFilesFormatted = formatFileSaveObject(newFiles, type);
    if (newFilesFormatted && newFilesFormatted.File_Save) {
        finalObj.File_Save = [...(finalObj.File_Save || []), ...newFilesFormatted.File_Save];
    }

    // 3. ถ้าไม่เหลือเลยให้เป็น null
    if (!finalObj.File_Save || finalObj.File_Save.length === 0) {
        return null;
    }

    return finalObj;
};
