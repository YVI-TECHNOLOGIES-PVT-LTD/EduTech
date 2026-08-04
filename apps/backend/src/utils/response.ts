export const sendResponse = (res: any, data: any, status = 200) => {
    res.status(status).json({ data });
};
