import { describe, expect, it, jest } from '@jest/globals'
import { FullstackTestingError } from '../../../src/core/errors.mjs'
import { ClusterManager, Kind, logging, constants, Kubectl } from '../../../src/core/index.mjs'

describe('ClusterManager', () => {
  const testLogger = logging.NewLogger('debug')
  const kind = new Kind(testLogger)
  const kubectl = new Kubectl(testLogger)
  const clusterCmd = new ClusterManager(kind, kubectl)

  it('should return a list of clusters', async () => {
    const getClusterMock = jest
      .spyOn(ClusterManager.prototype, 'getKubeConfig')
      .mockImplementation(() => Promise.resolve(
        {
          clusters: [
            { name: 'test' }
          ]
        }
      ))

    const clusters = await clusterCmd.getClusters()
    expect(getClusterMock).toHaveBeenCalled()
    expect(clusters).toContain('test')
    getClusterMock.mockReset()
  })

  it('should fail to list clusters on error', async () => {
    const getClusterMock = jest
      .spyOn(ClusterManager.prototype, 'getKubeConfig')
      .mockImplementation(() => {
        throw new FullstackTestingError('mock error')
      })
    await expect(clusterCmd.getClusters()).rejects.toThrowError(FullstackTestingError)
    expect(getClusterMock).toHaveBeenCalled()
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
      .mockImplementation(() => {
        throw new FullstackTestingError('mock error')
      })
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
      .mockImplementation(() => {
        throw new FullstackTestingError('mock error')
      })
    await expect(clusterCmd.deleteCluster('test')).rejects.toThrowError(FullstackTestingError)
    expect(getClusterMock).toHaveBeenCalledWith('test')
  })
  it('should strip kind name', async () => {
    expect(clusterCmd.parseKindClusterName('kind-kind-test')).toBe('test')
    expect(clusterCmd.parseKindClusterName('test')).toBe('test')
  })
})
