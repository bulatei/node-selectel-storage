import {IncomingHttpHeaders, OutgoingHttpHeaders} from "http";

interface IResolveData {
    body: string
    headers: IncomingHttpHeaders
    statusCode?: number | undefined
    statusMessage?: string | undefined
}

declare class Selectel {
    USER: string
    PASSWORD: string
    AUTH_STATUS: boolean
    X_AUTH_TOKEN: boolean
    X_EXPIRE_AUTH_TOKEN: boolean
    X_STORAGE_URL: boolean
    X_STORAGE_URL_HOST: boolean
    X_STORAGE_URL_PATH: boolean

    constructor(USER: string, PASSWORD: string)

    infoStorage(): Promise<IResolveData>
    listContainers(options: object): Promise<IResolveData>
    createContainer(container_name: string, options: {
            format: string,
            limit: string,
            marker: string
        } = {}): Promise<IResolveData>
    infoContainer(container_name: string): Promise<IResolveData>
    editMeta(container_name: string, options: {
        headers: OutgoingHttpHeaders | undefined
    } = {}): Promise<IResolveData>
    deleteContainer(container_name: string): Promise<IResolveData>
    listFiles(container_name: string, options: {
        format: string,
        limit: string,
        marker: string,
        prefix: string,
        path: string,
        delimiter: string
    } = {}): Promise<IResolveData>
    downloadFile(remote_path_to_file: string, local_path_to_file: string): Promise<IResolveData>
    uploadFile(local_path_to_file_or_buffer: string | Buffer, remote_path_to_file: string, options: {
        headers: OutgoingHttpHeaders | undefined,
        arhive: string | undefined
    } = {}): Promise<IResolveData>
    uploadArhUnpack(local_path_to_file_or_buffer: string | Buffer, remote_path: string, arhive_format: string, options: {
        headers: OutgoingHttpHeaders | undefined
    } = {}): Promise<IResolveData>
    uploadArhUnpack2(local_path_to_file_or_buffer: string | Buffer, remote_path: string, arhive_format: string, options: {
        headers: OutgoingHttpHeaders | undefined
    } = {}): Promise<IResolveData>
    arhUnpack2Status(extract_id: string): Promise<IResolveData>
}

export default Selectel