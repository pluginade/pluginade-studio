import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';

export default () => {
	return <Editor height="100%" theme="vs-dark" defaultLanguage="javascript" defaultValue="// some comment" />;
}