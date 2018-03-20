import React, { Component } from 'react';
import styled from 'styled-components';
import { withRouter } from 'react-router-dom';
import IPFS from 'ipfs';

const Container = styled.article``;
const IFrame = styled.iframe`
  width: 100vw;
  height: 100vh;
`;

class Gateway extends Component {
  node: IPFS;

  state = {
    files: [],
  };

  constructor(props) {
    super(props);
    this.state = { text: props.initialText, files: [] };

    // 用随机的仓库地址（IPFS 在本地缓存数据的地方）来初始化 IPFS 节点
    const repoPath = 'ipfs-' + Math.random();
    this.node = new IPFS({ repo: repoPath });

    // 节点完成初始化并开始连接其他节点后会触发 ready 事件
    this.node.on('ready', () => console.log('Online status: ', this.node.isOnline() ? 'online' : 'offline'));
  }

  async componentWillMount() {
    await this.ready();
    this.getFile(this.props.match.params.hash);
  }

  ready() {
    return new Promise((resolve, reject) => {
      this.node.on('ready', () => {
        if (this.node.isOnline()) {
          resolve();
        } else {
          reject(new Error(`this.node.isOnline() === ${this.node.isOnline()}`));
        }
      });
    });
  }

  getFile(hash: string) {
    this.node.files.get(hash, (err, files) => {
      if (files) {
        this.setState({ files });
      }
    });
  }

  render() {
    return (
      <Container>
        {this.props.match.params.hash}
        {/* <IFrame srcdoc="<html><body>Hello, <b>world</b>.</body></html>" /> */}
        {this.state.files.map(({ hash, type, content }) => {
          if (type === 'file') {
            return <div>{content.toString('utf8')}</div>;
          } else {
            return <div>Folder {hash}</div>;
          }
        })}
      </Container>
    );
  }
}

export default withRouter(Gateway);
