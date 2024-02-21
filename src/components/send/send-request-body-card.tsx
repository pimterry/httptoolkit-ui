import * as React from 'react';
import { action, computed, observable } from 'mobx';
import { observer } from 'mobx-react';
import * as portals from 'react-reverse-portal';

import { bufferToString, isProbablyUtf8, stringToBuffer } from '../../util';
import { RawHeaders } from '../../types';

import { EditableContentType, EditableContentTypes } from '../../model/events/content-types';
import { EditableBody } from '../../model/http/editable-body';

import { ExpandableCardProps } from '../common/card';
import { SendBodyCardSection } from './send-card-section';
import { ContainerSizedEditor } from '../editor/base-editor';
import {
    EditableBodyCardHeader,
    ContainerSizedEditorCardContent,
    BodyCodingErrorBanner
} from '../editor/body-card-components';

export interface SendRequestBodyProps extends ExpandableCardProps {
    headers: RawHeaders;
    body: EditableBody;
    onBodyUpdated: (body: Buffer) => void;
    editorNode: portals.HtmlPortalNode<typeof ContainerSizedEditor>;
}

@observer
export class SendRequestBodyCard extends React.Component<SendRequestBodyProps> {

    @observable
    private contentType: EditableContentType = 'text';

    @action.bound
    onChangeContentType(value: string) {
        this.contentType = value as EditableContentType;
    }

    @computed
    get textEncoding() {
        return isProbablyUtf8(this.props.body.decoded)
            ? 'utf8'
            : 'binary';
    }

    updateBody = (input: string) => {
        this.props.onBodyUpdated(
            stringToBuffer(input, this.textEncoding)
        );
    }

    render() {
        const {
            editorNode,
            expanded,
            onExpandToggled,
            onCollapseToggled,
            headers,
            body
        } = this.props;

        const bodyString = bufferToString(body.decoded, this.textEncoding);

        return <SendBodyCardSection
            {...this.props}
            headerAlignment='left'
        >
            <header>
                <EditableBodyCardHeader
                    body={body}
                    onBodyFormatted={this.updateBody}

                    title='Request body'
                    expanded={expanded}
                    onExpandToggled={onExpandToggled}
                    onCollapseToggled={onCollapseToggled}

                    selectedContentType={this.contentType}
                    contentTypeOptions={EditableContentTypes}
                    onChangeContentType={this.onChangeContentType}
                />
            </header>

            {
                body.latestEncodingResult.state === 'rejected'
                && <BodyCodingErrorBanner
                    error={body.latestEncodingResult.value as Error}
                    headers={headers}
                    type='encoding'
                />
            }

            <ContainerSizedEditorCardContent>
                <portals.OutPortal<typeof ContainerSizedEditor>
                    node={editorNode}

                    contentId='request'
                    language={this.contentType}
                    value={bodyString}
                    onChange={this.updateBody}
                />
            </ContainerSizedEditorCardContent>
        </SendBodyCardSection>;
    }
}