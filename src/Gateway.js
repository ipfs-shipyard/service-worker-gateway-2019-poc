import React, { Component } from 'react';
import styled from 'styled-components';
import { withRouter } from 'react-router-dom';

const Container = styled.article``;
const IFrame = styled.iframe`
  width: 100vw;
  height: 100vh;
`;

class Gateway extends Component {
  render() {
    return (
      <Container>
        {this.props.match.params.hash}
        <IFrame src="http://www.baidu.com" />
      </Container>
    );
  }
}

export default withRouter(Gateway);
