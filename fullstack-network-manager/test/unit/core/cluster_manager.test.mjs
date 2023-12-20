import { describe, expect, it, jest } from '@jest/globals'
import { FullstackTestingError } from '../../../src/core/errors.mjs'
import { ClusterManager, Kind, logging, constants } from '../../../src/core/index.mjs'

describe('ClusterManager', () => {
  const testLogger = logging.NewLogger('debug')
  const kind = new Kind(testLogger)
  const clusterCmd = new ClusterManager(kind)

  it('should return a list of clusters', async () => {
    const getClusterMock = jest
      .spyOn(Kind.prototype, 'getClusters')
      .mockImplementation(() => Promise.resolve(['test']))

    const clusters = await clusterCmd.getClusters()
    expect(getClusterMock).toHaveBeenCalledWith('-q')
    expect(clusters).toContain('test')
  })

  it('should fail to list clusters on error', async () => {
    const getClusterMock = jest
      .spyOn(Kind.prototype, 'getClusters')
      .mockImplementation(() => { throw new FullstackTestingError('mock error') })
    await expect(clusterCmd.getClusters()).rejects.toThrowError(FullstackTestingError)
    expect(getClusterMock).toHaveBeenCalledWith('-q')
  })

  it('should be able to create a clusters', async () => {
    const getClusterMock = jest
      .spyOn(Kind.prototype, 'createCluster')
      .mockImplementation(() => '')
    await expect(clusterCmd.createCluster('test')).resolves
    expect(getClusterMock).toHaveBeenCalledWith('test', `--config ${constants.RESOURCES_DIR}/dev-cluster.yaml`)
  })

  it('should fail to create cluster on error', async () => {
    const getClusterMock = jest
      .spyOn(Kind.prototype, 'createCluster')
      .mockImplementation(() => { throw new FullstackTestingError('mock error') })
    await expect(clusterCmd.createCluster('test')).rejects.toThrowError(FullstackTestingError)
    expect(getClusterMock).toHaveBeenCalledWith('test', `--config ${constants.RESOURCES_DIR}/dev-cluster.yaml`)
  })

  it('should be able to delete a clusters', async () => {
    const getClusterMock = jest
      .spyOn(Kind.prototype, 'deleteCluster')
      .mockImplementation(() => '')
    await expect(clusterCmd.deleteCluster('test')).resolves
    expect(getClusterMock).toHaveBeenCalledWith('test')
  })

  it('should fail to delete cluster on error', async () => {
    const getClusterMock = jest
      .spyOn(Kind.prototype, 'deleteCluster')
      .mockImplementation(() => { throw new FullstackTestingError('mock error') })
    await expect(clusterCmd.deleteCluster('test')).rejects.toThrowError(FullstackTestingError)
    expect(getClusterMock).toHaveBeenCalledWith('test')
  })
})
